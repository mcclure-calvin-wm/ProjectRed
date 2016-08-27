function Entity(position, width, height, world) {
    this.position = position || new Vector(0, 0);
    this.width = width || 32;
    this.height = height || 32;
    this.world = world;
    this.update = function() {};
    this.render = function(worldCoordinates) {
        if(worldCoordinates) {

        }
    }
}